from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import select, String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from contextlib import asynccontextmanager
import enum
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY= os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Base
class Base(DeclarativeBase):
    pass

class IssueStatus(enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress" 
    DONE = "Done"

class IssuePriority(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    owner: Mapped["User"] = relationship("User", back_populates="projects")
    issues: Mapped[List["Issue"]] = relationship("Issue", back_populates="project", cascade="all, delete-orphan")

class Issue(Base):
    __tablename__ = "issues"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[IssueStatus] = mapped_column(SQLEnum(IssueStatus), default=IssueStatus.TODO)
    priority: Mapped[IssuePriority] = mapped_column(SQLEnum(IssuePriority), default=IssuePriority.MEDIUM)
    assignee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    project: Mapped["Project"] = relationship("Project", back_populates="issues")

# Pydantic Models
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    owner_id: int
    created_at: datetime

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: IssueStatus = IssueStatus.TODO
    priority: IssuePriority = IssuePriority.MEDIUM
    assignee: Optional[str] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee: Optional[str] = None

class IssueResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: IssueStatus
    priority: IssuePriority
    assignee: Optional[str]
    project_id: int
    created_at: datetime

# Auth
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)

# db Dependency
async def get_db():
    async with async_session() as session:
        yield session

# auth Dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise credentials_exception
    
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

# API Routes
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@app.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

@app.post("/login", response_model=Token)
async def login(user: UserCreate, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalar_one_or_none()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/projects", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    result = await db.execute(
        select(Project).where(Project.owner_id == current_user.id)
    )
    projects = result.scalars().all()
    return projects

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_project = Project(**project.dict(), owner_id=current_user.id)
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

@app.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/projects/{project_id}/issues", response_model=List[IssueResponse])
async def get_project_issues(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    
    # Verify project ownership
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    if not project_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get issues
    result = await db.execute(
        select(Issue).where(Issue.project_id == project_id)
    )
    issues = result.scalars().all()
    return issues

@app.post("/projects/{project_id}/issues", response_model=IssueResponse)
async def create_issue(
    project_id: int,
    issue: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    
    # Verify project ownership
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_issue = Issue(**issue.dict(), project_id=project_id)
    db.add(db_issue)
    await db.commit()
    await db.refresh(db_issue)
    return db_issue

@app.put("/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: int,
    issue_update: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    
    # Get issue and verify ownership through project
    result = await db.execute(
        select(Issue).join(Project).where(
            Issue.id == issue_id,
            Project.owner_id == current_user.id
        )
    )
    db_issue = result.scalar_one_or_none()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Update fields
    update_data = issue_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_issue, field, value)
    
    await db.commit()
    await db.refresh(db_issue)
    return db_issue

@app.delete("/issues/{issue_id}")
async def delete_issue(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    
    result = await db.execute(
        select(Issue).join(Project).where(
            Issue.id == issue_id,
            Project.owner_id == current_user.id
        )
    )
    db_issue = result.scalar_one_or_none()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    await db.delete(db_issue)
    await db.commit()
    return {"message": "Issue deleted successfully"}

@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)