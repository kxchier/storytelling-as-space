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

scene_text = sys.stdin.read()
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

print(json.dumps({ "assets": assets }))