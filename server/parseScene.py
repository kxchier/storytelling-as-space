import sys
import os
import json
import spacy

nlp = spacy.load("en_core_web_sm")

with open(os.path.join(os.path.dirname(__file__), "assetPrompt.json")) as f:
    PROMPT_TEMPLATE = json.load(f)

IGNORE_WORDS = {
    "she", "he", "they", "it", "rain", "sadness", "silence", "memory",
    "loneliness", "warmth", "light", "sound"
}

CATEGORY_RULES = {
    "furniture": ["desk", "table", "chair", "bed", "counter", "shelf", "sofa"],
    "architecture": ["window", "door", "wall", "floor", "ceiling", "stairs"],
    "lighting": ["lamp", "lantern", "candle", "light"],
    "decor": ["rug", "painting", "poster", "curtain", "mirror", "vase"],
    "nature": ["plant", "flower", "tree"],
}


def clean_name(text):
    text = text.lower().strip()
    for word in ["a ", "an ", "the ", "her ", "his ", "their ", "my "]:
        if text.startswith(word):
            text = text[len(word):]
    return text.strip()


def categorize(name):
    for category, words in CATEGORY_RULES.items():
        if any(word in name for word in words):
            return category
    return "object"


def placement_type(category, name):
    if category == "architecture" and any(word in name for word in ["window", "door", "wall"]):
        return "wall"
    if category in ["furniture", "object", "decor", "nature", "lighting"]:
        return "floor"
    return "sprite"


def build_prompt(name):
    name_line = PROMPT_TEMPLATE["nameTemplate"].format(name=name)
    return " ".join([name_line, *PROMPT_TEMPLATE["suffix"]])


def parse_scene_text(scene_text):
    doc = nlp(scene_text)

    seen = set()
    assets = []

    for chunk in doc.noun_chunks:
        name = clean_name(chunk.text)

        if not name:
            continue

        if name in IGNORE_WORDS:
            continue

        if len(name) < 2:
            continue

        if name in seen:
            continue

        seen.add(name)

        category = categorize(name)

        assets.append({
            "name": name,
            "category": category,
            "placementType": placement_type(category, name),
            "prompt": build_prompt(name)
        })

    return {"assets": assets}


def worker_loop():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as error:
            print(json.dumps({"error": f"Invalid request JSON: {error}"}), flush=True)
            continue

        command = request.get("cmd")

        if command == "ping":
            print(json.dumps({"status": "ok"}), flush=True)
            continue

        if command != "parse":
            print(json.dumps({"error": f"Unknown command: {command}"}), flush=True)
            continue

        scene_text = request.get("sceneText", "")
        print(json.dumps(parse_scene_text(scene_text)), flush=True)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--worker":
        worker_loop()
    else:
        scene_text = sys.stdin.read()
        print(json.dumps(parse_scene_text(scene_text)))
