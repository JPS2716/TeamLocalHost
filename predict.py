import sys, os, json, pickle
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')

def safe_load(path):
    try:
        with open(path, 'rb') as f:
            return pickle.load(f)
    except Exception as e:
        return None

def simple_clean(text):
    # fallback simple cleaner
    import re
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
        text = payload.get('text', '') or ''
    except:
        text = raw or ''

    cleaner = safe_load(os.path.join(MODEL_DIR, 'clean_tweet.pkl'))
    vectorizer = safe_load(os.path.join(MODEL_DIR, 'vectorizer.pkl'))
    model = safe_load(os.path.join(MODEL_DIR, 'model.pkl'))

    if callable(cleaner):
        clean_text = cleaner(text)
    else:
        clean_text = simple_clean(text)

    scores = {'low': 0.0, 'moderate': 0.0, 'high': 1.0}  # fallback

    try:
        if vectorizer is not None and model is not None:
            X = vectorizer.transform([clean_text])
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(X)[0]
                # Attempt to map class order to low/moderate/high
                classes = [str(c).lower() for c in model.classes_]
                mapping = {}
                for idx, cls in enumerate(classes):
                    if 'low' in cls:
                        mapping['low'] = proba[idx]
                    elif 'moder' in cls:
                        mapping['moderate'] = proba[idx]
                    elif 'high' in cls:
                        mapping['high'] = proba[idx]
                    else:
                        # assign to moderate by default
                        mapping.setdefault('moderate', 0)
                        mapping['moderate'] += proba[idx]
                # ensure all keys
                for k in ['low', 'moderate', 'high']:
                    scores[k] = float(mapping.get(k, 0.0))
            else:
                pred = model.predict(X)[0]
                lbl = str(pred).lower()
                if 'low' in lbl:
                    scores = {'low': 1.0, 'moderate': 0.0, 'high': 0.0}
                elif 'high' in lbl:
                    scores = {'low': 0.0, 'moderate': 0.0, 'high': 1.0}
                else:
                    scores = {'low': 0.0, 'moderate': 1.0, 'high': 0.0}
    except Exception as e:
        # fallback random-ish based on text length
        ln = len(clean_text)
        scores = {
            'low': max(0.0, 1.0 - min(1.0, ln/200.0)),
            'moderate': 0.5 * min(1.0, ln/200.0),
            'high': min(1.0, ln/200.0) * 0.5
        }
        total = sum(scores.values())
        scores = {k: float(v/total) for k, v in scores.items()}

    # choose label
    label = max(scores.items(), key=lambda x: x[1])[0]
    label_text = label.title() + ' Stress'
    out = { "label": label_text, "scores": scores }
    sys.stdout.write(json.dumps(out))

if __name__ == '__main__':
    main()
