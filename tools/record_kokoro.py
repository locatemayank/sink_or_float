"""Record Fizz the frog's voice clips with Kokoro-82M (voice af_heart).

    node tools/voice_script.js > tools/voice_script.tsv     (every line in data.js -> id<TAB>text)
    pip install kokoro-onnx soundfile                          (and ffmpeg on the PATH)
    model files: kokoro-v1.0.int8.onnx + voices-v1.0.bin
      from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
    python tools/record_kokoro.py --model path/to/kokoro.onnx --voices path/to/voices.bin [--limit 12] [--only id,id]

Writes voice/<id>.mp3 and skips clips that already exist, so it can be stopped and re-run.
You can also record your own voice: name each file voice/<id>.mp3 using the ids in voice_script.tsv.
Any clip that is missing is read by the device's built-in voice instead.
"""
import argparse
import os
import subprocess
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VOICE = "af_heart"
SPEED = 0.9

# words the speech engine says oddly: say them like this instead (screen text unchanged)
SAY_AS = {
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    rows = []
    with open(os.path.join(HERE, "voice_script.tsv"), encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line:
                rid, text = line.split("\t")
                rows.append((rid, text))
    only = set(x for x in a.only.split(",") if x)
    out_dir = os.path.join(ROOT, "voice")
    os.makedirs(out_dir, exist_ok=True)

    k = Kokoro(a.model, a.voices)
    done = 0
    for rid, text in rows:
        if only and rid not in only:
            continue
        mp3 = os.path.join(out_dir, rid + ".mp3")
        if os.path.exists(mp3) and not a.force:
            continue
        say = SAY_AS.get(rid, text)
        samples, sr = k.create(say, voice=VOICE, speed=SPEED, lang="en-us")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wav = tmp.name
        # 0.1 s of quiet before the first word (a hard start blurs short words like "A rock!")
        samples = np.concatenate([np.zeros(int(sr * 0.1), dtype=samples.dtype), samples])
        sf.write(wav, samples, sr)
        # trim trailing silence, mono 48 kb/s mp3
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af",
                        "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
                        "apad=pad_dur=0.08",
                        "-ac", "1", "-b:a", "48k", mp3], check=True)
        os.remove(wav)
        done += 1
        print("recorded", rid, "-", text, flush=True)
        if a.limit and done >= a.limit:
            break
    left = sum(1 for rid, _ in rows if not os.path.exists(os.path.join(out_dir, rid + ".mp3")))
    print("done this run:", done, "| still missing:", left)


if __name__ == "__main__":
    main()
