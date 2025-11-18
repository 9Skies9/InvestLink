#!/usr/bin/env python3
"""
Make_Database.py

Create a local SQLite DB and load:

- company_info.csv            -> company_info
- user_info.csv               -> user_info
- company_login.csv           -> company_login
- user_login.csv              -> user_login
- user_to_company_interact.csv    -> user_to_company_interact
- company_to_user_interact.csv    -> company_to_user_interact

Optional:
- --enforce-fk     : PRAGMA foreign_keys=ON
- --with-history   : create *_history tables + triggers for interactions

Example:

  python3 Make_Database.py invest.sqlite \
    --company-info company_info.csv \
    --user-info user_info.csv \
    --company-login company_login.csv \
    --user-login user_login.csv \
    --user-to-company-csv user_to_company_interact.csv \
    --company-to-user-csv company_to_user_interact.csv \
    --enforce-fk \
    --with-history
"""

import argparse
import csv
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent     # .../InvestLink
DATA_ROOT = ROOT / "Data"
DATA_INIT = DATA_ROOT / "Initialization"
DB_COMPANY_INFO = "company_info"
DB_USER_INFO = "user_info"
DB_COMPANY_LOGIN = "company_login"
DB_USER_LOGIN = "user_login"
UCI = "user_to_company_interact"
CUI = "company_to_user_interact"
UCI_HIST = "user_to_company_interact_history"
CUI_HIST = "company_to_user_interact_history"

DDL_CORE = f"""
CREATE TABLE IF NOT EXISTS {DB_COMPANY_INFO} (
  company_id      INTEGER PRIMARY KEY,
  C_name          TEXT,
  C_desc          TEXT,
  C_place         TEXT,
  C_funding_stage TEXT,
  C_industry      TEXT,
  C_fund_size     TEXT,
  C_link          TEXT,
  C_img           TEXT
);

CREATE TABLE IF NOT EXISTS {DB_USER_INFO} (
  user_id               INTEGER PRIMARY KEY,
  U_name                TEXT,
  U_invest_requirements TEXT,
  U_places              TEXT,
  U_fund_stage          TEXT,
  U_industry            TEXT,
  U_check_size_max      TEXT,
  U_check_size_min      TEXT,
  U_website             TEXT,
  U_pic_link            TEXT
);

CREATE TABLE IF NOT EXISTS {DB_COMPANY_LOGIN} (
  company_id      INTEGER PRIMARY KEY,
  company_email   TEXT NOT NULL UNIQUE,
  company_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS {DB_USER_LOGIN} (
  user_id      INTEGER PRIMARY KEY,
  user_email   TEXT NOT NULL UNIQUE,
  user_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS {UCI} (
  u_id        INTEGER NOT NULL,
  c_id        INTEGER NOT NULL,
  like_or_not INTEGER,   -- -1 dislike/none, 0 no, 1 yes
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (u_id, c_id)
);

CREATE TABLE IF NOT EXISTS {CUI} (
  c_id        INTEGER NOT NULL,
  u_id        INTEGER NOT NULL,
  like_or_not INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (c_id, u_id)
);
"""

DDL_HISTORY = f"""
CREATE TABLE IF NOT EXISTS {UCI_HIST} (
  u_id       INTEGER NOT NULL,
  c_id       INTEGER NOT NULL,
  like_or_not INTEGER,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS {CUI_HIST} (
  c_id       INTEGER NOT NULL,
  u_id       INTEGER NOT NULL,
  like_or_not INTEGER,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_{UCI}_ins_hist;
CREATE TRIGGER trg_{UCI}_ins_hist
AFTER INSERT ON {UCI}
BEGIN
  INSERT INTO {UCI_HIST}(u_id, c_id, like_or_not)
  VALUES (NEW.u_id, NEW.c_id, NEW.like_or_not);
END;

DROP TRIGGER IF EXISTS trg_{UCI}_upd_hist;
CREATE TRIGGER trg_{UCI}_upd_hist
AFTER UPDATE ON {UCI}
BEGIN
  INSERT INTO {UCI_HIST}(u_id, c_id, like_or_not)
  VALUES (NEW.u_id, NEW.c_id, NEW.like_or_not);
END;

DROP TRIGGER IF EXISTS trg_{CUI}_ins_hist;
CREATE TRIGGER trg_{CUI}_ins_hist
AFTER INSERT ON {CUI}
BEGIN
  INSERT INTO {CUI_HIST}(c_id, u_id, like_or_not)
  VALUES (NEW.c_id, NEW.u_id, NEW.like_or_not);
END;

DROP TRIGGER IF EXISTS trg_{CUI}_upd_hist;
CREATE TRIGGER trg_{CUI}_upd_hist
AFTER UPDATE ON {CUI}
BEGIN
  INSERT INTO {CUI_HIST}(c_id, u_id, like_or_not)
  VALUES (NEW.c_id, NEW.u_id, NEW.like_or_not);
END;
"""

def import_company_info(conn, path):
    """
    company_info.csv:
      C_name,C_desc,C_place,C_funding_stage,C_industry,C_fund_size,C_link,C_img
    DB table company_info has an extra company_id (1..N).
    """
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {DB_COMPANY_INFO};")
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        company_id = 0
        for row in r:
            company_id += 1
            cur.execute(
                f"""INSERT OR REPLACE INTO {DB_COMPANY_INFO}
                    (company_id, C_name, C_desc, C_place, C_funding_stage,
                     C_industry, C_fund_size, C_link, C_img)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    company_id,
                    row.get("C_name", ""),
                    row.get("C_desc", ""),
                    row.get("C_place", ""),
                    row.get("C_funding_stage", ""),
                    row.get("C_industry", ""),
                    row.get("C_fund_size", ""),
                    row.get("C_link", ""),
                    row.get("C_img", ""),
                ),
            )
    conn.commit()
    return company_id  # number of rows


def import_user_info(conn, path):
    """
    user_info.csv:
      U_id,U_name,U_invest_requirements,U_places,U_fund_stage,U_industry,
      U_check size max,U_check size min,U_website,U_pic_link
    DB column names use underscores: U_check_size_max, U_check_size_min.
    """
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {DB_USER_INFO};")
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        n = 0
        for row in r:
            n += 1
            user_id = int(row.get("U_id", n))
            cur.execute(
                f"""INSERT OR REPLACE INTO {DB_USER_INFO}
                    (user_id, U_name, U_invest_requirements, U_places,
                     U_fund_stage, U_industry, U_check_size_max,
                     U_check_size_min, U_website, U_pic_link)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                (
                    user_id,
                    row.get("U_name", ""),
                    row.get("U_invest_requirements", ""),
                    row.get("U_places", ""),
                    row.get("U_fund_stage", ""),
                    row.get("U_industry", ""),
                    row.get("U_check size max", ""),
                    row.get("U_check size min", ""),
                    row.get("U_website", ""),
                    row.get("U_pic_link", ""),
                ),
            )
    conn.commit()
    return n


def import_company_login(conn, path):
    """
    company_login.csv:
      company_id,company_email,company_password
    """
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {DB_COMPANY_LOGIN};")
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        n = 0
        for row in r:
            n += 1
            cur.execute(
                f"""INSERT OR REPLACE INTO {DB_COMPANY_LOGIN}
                    (company_id, company_email, company_password)
                    VALUES (?, ?, ?);""",
                (
                    int(row["company_id"]),
                    row["company_email"],
                    row["company_password"],
                ),
            )
    conn.commit()
    return n


def import_user_login(conn, path):
    """
    user_login.csv:
      user_id,user_email,user_password
    """
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {DB_USER_LOGIN};")
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        n = 0
        for row in r:
            n += 1
            cur.execute(
                f"""INSERT OR REPLACE INTO {DB_USER_LOGIN}
                    (user_id, user_email, user_password)
                    VALUES (?, ?, ?);""",
                (
                    int(row["user_id"]),
                    row["user_email"],
                    row["user_password"],
                ),
            )
    conn.commit()
    return n


def import_interaction_csv(conn, table, cols, path):
    """
    Generic loader for interaction CSVs:
      user_to_company_interact.csv:   u_id,c_id,like_or_not
      company_to_user_interact.csv:   c_id,u_id,like_or_not
    """
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {table};")
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        placeholders = ",".join("?" for _ in cols)
        sql = f"INSERT OR REPLACE INTO {table} ({','.join(cols)}) VALUES ({placeholders});"
        batch = []
        n = 0
        for row in r:
            batch.append(tuple(row[c] for c in cols))
            if len(batch) >= 1000:
                cur.executemany(sql, batch)
                n += len(batch)
                batch.clear()
        if batch:
            cur.executemany(sql, batch)
            n += len(batch)
    conn.commit()
    return n



def main():
    
    ap = argparse.ArgumentParser(description="Create SQLite DB and load CSVs.")

    # DB path: default to Data/invest.sqlite
    ap.add_argument(
        "db",
        nargs="?",
        default=str(DATA_ROOT / "invest.sqlite"),
        help="SQLite DB path (default: Data/invest.sqlite)",
    )

    # CSVs: default to Data/Initialization/*
    ap.add_argument("--company-info", default=str(DATA_INIT / "company_info.csv"))
    ap.add_argument("--user-info", default=str(DATA_INIT / "user_info.csv"))
    ap.add_argument("--company-login", default=str(DATA_INIT / "company_login.csv"))
    ap.add_argument("--user-login", default=str(DATA_INIT / "user_login.csv"))
    ap.add_argument(
        "--user-to-company-csv",
        default=str(DATA_INIT / "user_to_company_interact.csv"),
    )
    ap.add_argument(
        "--company-to-user-csv",
        default=str(DATA_INIT / "company_to_user_interact.csv"),
    )
  
    ap.add_argument("--enforce-fk", action="store_true",
                    help="Enable PRAGMA foreign_keys=ON.")
    ap.add_argument("--with-history", action="store_true",
                    help="Create *_history tables + triggers for interactions.")

    args = ap.parse_args()

    Path(os.path.dirname(args.db) or ".").mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")

    try:
        if args.enforce_fk:
            conn.execute("PRAGMA foreign_keys = ON;")

        # core schema
        conn.executescript(DDL_CORE)

        # main data
        n_comp = import_company_info(conn, args.company_info)
        n_user = import_user_info(conn, args.user_info)
        print(f"Loaded company_info: {n_comp} rows")
        print(f"Loaded user_info:    {n_user} rows")

        # logins
        n_clog = import_company_login(conn, args.company_login)
        n_ulog = import_user_login(conn, args.user_login)
        print(f"Loaded company_login: {n_clog} rows")
        print(f"Loaded user_login:    {n_ulog} rows")

        # interactions
        n_uci = import_interaction_csv(conn, UCI,
                                       ["u_id", "c_id", "like_or_not"],
                                       args.user_to_company_csv)
        n_cui = import_interaction_csv(conn, CUI,
                                       ["c_id", "u_id", "like_or_not"],
                                       args.company_to_user_csv)
        print(f"Loaded {UCI}: {n_uci} rows")
        print(f"Loaded {CUI}: {n_cui} rows")

        if args.with_history:
            conn.executescript(DDL_HISTORY)
            print("History tables + triggers installed.")

        # show tables
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
        ).fetchall()
        print("\nTables in DB:")
        for (name,) in rows:
            print(" -", name)

    finally:
        conn.close()


if __name__ == "__main__":
    main()