"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./UserMenu.module.scss";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Props = {
  initialUser: User | null;
};

export default function UserMenu({
  initialUser,
}: Props) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(
    initialUser,
  );

  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(
    null,
  );
  

  async function handleSignOut() {
    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to sign out");
      }

      setUser(null);
      setOpen(false);

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Sign out failed:",
        error,
      );
    }
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={styles.loginButton}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div
      className={styles.wrapper}
      ref={menuRef}
    >
      <button
        type="button"
        className={styles.userButton}
        onClick={() =>
          setOpen((current) => !current)
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.userIcon}>
          ●
        </span>

        <span className={styles.userName}>
          {user.name}
        </span>

        <span
          className={`${styles.chevron} ${
            open ? styles.chevronOpen : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className={styles.dropdown}
          role="menu"
        >
          <div className={styles.userInfo}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <div className={styles.menuGroup}>
            {user.role === "ADMIN" && (
              <Link
                href="/admin/leads"
                onClick={() => setOpen(false)}
              >
                Admin: Leads
              </Link>
            )}

            <Link
              href="/saved"
              onClick={() => setOpen(false)}
            >
              Saved
            </Link>

            <Link
              href="/account"
              onClick={() => setOpen(false)}
            >
              Account
            </Link>
          </div>

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.signOut}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}