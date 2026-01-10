from fastapi import FastAPI

app = FastAPI(title="PlannerX MVP")

@app.get("/health")
def health():
    return {"status": "ok"}
