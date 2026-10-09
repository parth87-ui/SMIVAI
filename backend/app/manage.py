"""SMIVAI — administration commands (run from backend/).

    python -m app.manage create-staff --role admin --mobile 98XXXXXXXX --name "Name"
    python -m app.manage create-staff --role charity_partner --mobile 98XXXXXXXX --name "Name" --org "Partner org"
    python -m app.manage list-staff

Staff (administrators and charity-partner reviewers) cannot sign up through
the app; this is the only way to create them. The mobile number is stored as
a salted hash plus its last four digits, like every other identity number.
"""
from __future__ import annotations

import argparse
import sys
import uuid

from . import models
from .auth import check_identity, hash_identity
from .database import Base, SessionLocal, engine


def create_staff(db, role: str, mobile: str, name: str, org: str | None = None) -> models.Account:
    if role not in ("admin", "charity_partner"):
        raise ValueError("role must be admin or charity_partner")
    res = check_identity("mobile", mobile)
    if not res["ok"]:
        raise ValueError(res["error"])
    digest = hash_identity(role, "mobile", res["normalized"])
    existing = db.query(models.Account).filter(models.Account.role == role, models.Account.id_hash == digest).first()
    if existing is not None:
        return existing
    staff_id = f"stf_{uuid.uuid4().hex[:12]}"
    db.add(models.Staff(staff_id=staff_id, role=role, name=name, organisation=org))
    acct = models.Account(account_id=f"acct_{uuid.uuid4().hex[:12]}", role=role, entity_id=staff_id, name=name,
                          id_type="mobile", id_hash=digest, id_last4=res["last4"], phone_tail=res["last4"],
                          verification="created_by_admin_command")
    db.add(acct)
    db.commit()
    return acct


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m app.manage")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("create-staff")
    c.add_argument("--role", required=True, choices=["admin", "charity_partner"])
    c.add_argument("--mobile", required=True)
    c.add_argument("--name", required=True)
    c.add_argument("--org")
    sub.add_parser("list-staff")
    args = ap.parse_args(argv)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if args.cmd == "create-staff":
            acct = create_staff(db, args.role, args.mobile, args.name, args.org)
            print(f"{args.role}: {acct.name} (mobile ending {acct.id_last4}) — account {acct.account_id}")
        else:
            for s in db.query(models.Staff).all():
                print(f"{s.role:16} {s.name}  {s.organisation or ''}")
    except ValueError as e:
        print("Error:", e, file=sys.stderr)
        return 1
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
