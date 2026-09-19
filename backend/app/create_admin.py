from __future__ import annotations

import os

from auth import hash_password
from database import SessionLocal, init_db
from models import User


def main() -> None:
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not password:
        raise SystemExit(
            "Set ADMIN_USERNAME and ADMIN_PASSWORD before running "
            "create_admin."
        )

    if len(password) < 8:
        raise SystemExit(
            "ADMIN_PASSWORD must contain at least 8 characters."
        )

    init_db()

    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if user:
            user.is_admin = True
            user.hashed_password = hash_password(password)

            message = (
                f"Promoted existing user '{username}' to admin "
                "and updated password."
            )
        else:
            user = User(
                username=username,
                hashed_password=hash_password(password),
                is_admin=True,
            )

            db.add(user)

            message = f"Created admin user '{username}'."

        db.commit()

        print(message)

    finally:
        db.close()


if __name__ == "__main__":
    main()