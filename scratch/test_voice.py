import re

def test_parse(text):
    text = text.lower().strip()
    stop_words = set([
        "i", "have", "has", "just", "now", "please", "the", "a", "an", "of", "my",
        "add", "added", "remove", "removed", "sold", "sell", "used", "received", "harvested",
        "harvest", "got", "bought", "increase", "more", "put", "store", "stored", "stock",
        "reduce", "decrease", "take", "out", "from", "to", "and", "for", "with",
        "kg", "kilo", "kilogram", "ton", "tons", "lbs", "lb", "bu", "bushel", "unit", "units", "liter", "litre",
        "mera", "meri", "mere", "ki", "ke", "ka", "hai", "hain", "se", "ko", "ne",
        "joda", "jodo", "mila", "becha", "nikala", "hatao", "rakha",
    ])
    words = re.sub(r'[^\w\s]', '', text).split()
    crop_words = [w.capitalize() for w in words if w.isalpha() and w not in stop_words and len(w) > 2]
    crop_name = " ".join(crop_words).strip() or "Unknown Crop"
    return crop_name

print(f"English: {test_parse('Add 50 kg wheat')}")
print(f"Hindi: {test_parse('30 किलो चावल जोड़ा')}") # rice added
print(f"Tamil: {test_parse('Tomato 20 kg uthara')}") # tomato remove
print(f"Telugu: {test_parse('Maize 100 kg adda')}")
