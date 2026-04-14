from fastapi import APIRouter, Depends
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/protected", tags=["Protected"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user)):
    return {
        "message": f"Welcome {current_user.full_name}",
        "email": current_user.email
    }