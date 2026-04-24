from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os

app = FastAPI(title="AgriLink API", version="1.0.0")

# The path to the compiled React app
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

from backend.database import engine
from backend import models
from backend.routers import inventory, marketplace, scanner, wallet

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Mount API routers
app.include_router(inventory.router)
app.include_router(marketplace.router)
app.include_router(scanner.router)
app.include_router(wallet.router)

import os
from fastapi.responses import FileResponse

# Serve the static files (js, css, assets) inside frontend/dist
if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

# Fallback route for SPA: serve index.html for any unhandled path
@app.get("/{catchall:path}")
async def serve_spa(catchall: str):
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not built yet. Run 'npm run build' inside the frontend directory."}

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
