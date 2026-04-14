# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import text

# from app.database import Base, engine
# from app.models import contract, document, user  # noqa: F401
# from app.routers import protected, risk_dashboard
# from app.routers.auth import router as auth_router
# from app.routers.contracts import router as contract_router
# from app.routers.document import router as document_router

# app = FastAPI(title="LexaAI Backend", version="1.0.0")

# Base.metadata.create_all(bind=engine)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:8081",
#         "http://127.0.0.1:8081",
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(protected.router)
# app.include_router(document_router)
# app.include_router(auth_router)
# app.include_router(contract_router)
# app.include_router(risk_dashboard.router)


# @app.get("/")
# def root():
#     return {"message": "LexaAI API running"}


# @app.get("/health")
# def health():
#     try:
#         with engine.connect() as connection:
#             connection.execute(text("SELECT 1"))
#         return {"status": "ok"}
#     except Exception as exc:
#         return {"status": "error", "detail": str(exc)}



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.models import contract, document, user  # noqa: F401
from app.routers import protected, risk_dashboard
from app.routers.auth import router as auth_router
from app.routers.contracts import router as contract_router
from app.routers.document import router as document_router

app = FastAPI(title="LexaAI Backend", version="1.0.0")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",

    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(protected.router)
app.include_router(document_router)
app.include_router(auth_router)
app.include_router(contract_router)
app.include_router(risk_dashboard.router)


@app.get("/")
def root():
    return {"message": "LexaAI API running"}


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
