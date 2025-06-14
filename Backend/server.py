from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re
import json

app = FastAPI()

model_name = "bigcode/tiny_starcoder_py"  # Modèle allégé

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True)
model.eval()

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

class CodeRequest(BaseModel):
    language: str
    code: str

@app.post("/evaluate")
async def evaluate_code(req: CodeRequest):
    prompt = f"""Évalue ce code {req.language} sur 10 points en fonction de :

1. Exactitude (fonctionnel ?)
2. Optimisation (efficace ?)
3. Lisibilité (clair ?)
4. Bonnes pratiques (conventions suivies ?)

Code :\n{req.code}

Retourne un JSON strict de la forme :
{{
"score": X,
"feedback": "Commentaire ici"
}}
"""

    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=150,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
    )
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    match = re.search(r"\{(?:[^{}]|(?R))*\}", text, re.DOTALL)
    if match:
        response_json = match.group(0)
        try:
            response = json.loads(response_json)
            return response
        except json.JSONDecodeError:
            return {"score": None, "feedback": "Impossible d'analyser la réponse JSON."}
    else:
        return {"score": None, "feedback": "Aucune réponse JSON trouvée dans la réponse du modèle."}
