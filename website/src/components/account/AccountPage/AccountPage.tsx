"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./AccountPage.module.scss";

type User = {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  role: string;

  region: string | null;
  industry: string | null;
  jobTitle: string | null;
  seniority: string | null;
};

type Props = {
  user: User;
};

export default function AccountPage({
  user,
}: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState(user);

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(user.name);

  // const [phone, setPhone] =
  //   useState(user.phone ?? "");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [changingPassword, setChangingPassword] =
  useState(false);

const [currentPassword, setCurrentPassword] =
  useState("");

const [newPassword, setNewPassword] =
  useState("");

const [confirmPassword, setConfirmPassword] =
  useState("");

const [passwordSaving, setPasswordSaving] =
  useState(false);

const [passwordError, setPasswordError] =
  useState("");

const [passwordMessage, setPasswordMessage] =
  useState("");

const [region, setRegion] =
  useState(user.region ?? "");

const [industry, setIndustry] =
  useState(user.industry ?? "");

const [jobTitle, setJobTitle] =
  useState(user.jobTitle ?? "");

const [seniority, setSeniority] =
  useState(user.seniority ?? "");

const [profileSaving, setProfileSaving] =
  useState(false);

const [profileMessage, setProfileMessage] =
  useState("");

const [profileError, setProfileError] =
  useState("");

  function startEditing() {
    setName(currentUser.name);
    // setPhone(currentUser.phone ?? "");

    setMessage("");
    setError("");

    setEditing(true);
  }

  function cancelEditing() {
    setName(currentUser.name);
    // setPhone(currentUser.phone ?? "");

    setMessage("");
    setError("");

    setEditing(false);
  }

  async function handleSaveProfile() {
    if (saving) {
      return;
    }

    setMessage("");
    setError("");

const cleanName = name.trim();

    if (!cleanName) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/account/profile",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

body: JSON.stringify({
  name: cleanName,
}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to update account.",
        );
      }

      setCurrentUser(data.user);

      setName(data.user.name);
      // setPhone(data.user.phone ?? "");

      setEditing(false);

      setMessage(
        "Account information updated successfully.",
      );

      /*
       * Refresh server components so other UI
       * using getCurrentUser() receives the
       * updated account information.
       */
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openPasswordForm() {
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");

  setPasswordError("");
  setPasswordMessage("");

  setChangingPassword(true);
}

function cancelPasswordChange() {
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");

  setPasswordError("");

  setChangingPassword(false);
}

async function handleChangePassword() {
  if (passwordSaving) {
    return;
  }

  setPasswordError("");
  setPasswordMessage("");

  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    setPasswordError(
      "All password fields are required.",
    );
    return;
  }

  if (newPassword.length < 8) {
    setPasswordError(
      "New password must be at least 8 characters.",
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError(
      "New passwords do not match.",
    );
    return;
  }

  setPasswordSaving(true);

  try {
    const response = await fetch(
      "/api/account/password",
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ??
          "Unable to change password.",
      );
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setChangingPassword(false);

    setPasswordMessage(
      "Password changed successfully.",
    );
  } catch (err) {
    setPasswordError(
      err instanceof Error
        ? err.message
        : "Unable to change password.",
    );
  } finally {
    setPasswordSaving(false);
  }
}

async function handleSavePreferences() {
  if (profileSaving) {
    return;
  }

  setProfileMessage("");
  setProfileError("");
  setProfileSaving(true);

  try {
    const response = await fetch(
      "/api/account/preferences",
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          region,
          industry,
          jobTitle,
          seniority,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ??
          "Unable to save profile.",
      );
    }

    setRegion(data.profile.region ?? "");
    setIndustry(
      data.profile.industry ?? "",
    );
    setJobTitle(
      data.profile.jobTitle ?? "",
    );
    setSeniority(
      data.profile.seniority ?? "",
    );

    setProfileMessage(
      "Profile saved successfully.",
    );

    router.refresh();
  } catch (err) {
    setProfileError(
      err instanceof Error
        ? err.message
        : "Unable to save profile.",
    );
  } finally {
    setProfileSaving(false);
  }
}

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* TOP ACCOUNT NAV */}
        <nav className={styles.accountNav}>
          <a href="#">My Interests</a>

          <a
            href="/account"
            className={styles.active}
          >
            Account
          </a>

          <a href="#">Subscription</a>

          <a href="#">
            Help Center ↗
          </a>
        </nav>

        <div className={styles.pageIntro}>
          <h1>
            Hello, {currentUser.name}
          </h1>
        </div>

        <div className={styles.grid}>
          {/* LEFT */}
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <h2>My Account Information</h2>

              <div className={styles.infoRow}>
                <span>Account Number</span>

                <strong>
                  SF-
                  {String(
                    currentUser.id,
                  ).padStart(6, "0")}
                </strong>
              </div>

              {editing ? (
                <>
                  <div
                    className={
                      styles.editField
                    }
                  >
                    <label htmlFor="account-name">
                      Name
                    </label>

                    <input
                      id="account-name"
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value,
                        )
                      }
                      maxLength={100}
                      autoComplete="name"
                    />
                  </div>

<div className={styles.infoRow}>
  <span>Phone</span>

  <strong>
    {currentUser.phone || "Not provided"}
  </strong>

  <small className={styles.readOnlyText}>
    Phone number cannot be changed here.
  </small>
</div>

                  <div
                    className={
                      styles.infoRow
                    }
                  >
                    <span>
                      Email Address
                    </span>

                    <strong>
                      {currentUser.email}
                    </strong>

                    <small
                      className={
                        styles.readOnlyText
                      }
                    >
                      Email cannot be changed
                      here.
                    </small>
                  </div>

                  {error && (
                    <p
                      className={
                        styles.errorMessage
                      }
                    >
                      {error}
                    </p>
                  )}

                  <div
                    className={
                      styles.editActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={
                        cancelEditing
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className={
                        styles.primaryButton
                      }
                      onClick={
                        handleSaveProfile
                      }
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={
                      styles.infoRow
                    }
                  >
                    <span>Name</span>

                    <strong>
                      {currentUser.name}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.infoRow
                    }
                  >
                    <span>Phone</span>

                    <strong>
                      {currentUser.phone ||
                        "Not provided"}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.infoRow
                    }
                  >
                    <span>
                      Email Address
                    </span>

                    <strong>
                      {currentUser.email}
                    </strong>
                  </div>

                  {message && (
                    <p
                      className={
                        styles.successMessage
                      }
                    >
                      {message}
                    </p>
                  )}

                  <button
                    type="button"
                    className={
                      styles.primaryButton
                    }
                    onClick={startEditing}
                  >
                    Edit
                  </button>
                </>
              )}
            </section>

<section className={styles.card}>
  <h2>Security</h2>

  {changingPassword ? (
    <>
      <div className={styles.editField}>
        <label htmlFor="current-password">
          Current Password
        </label>

        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) =>
            setCurrentPassword(e.target.value)
          }
          autoComplete="current-password"
        />
      </div>

      <div className={styles.editField}>
        <label htmlFor="new-password">
          New Password
        </label>

        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value)
          }
          autoComplete="new-password"
        />

        <small className={styles.readOnlyText}>
          Use at least 8 characters.
        </small>
      </div>

      <div className={styles.editField}>
        <label htmlFor="confirm-password">
          Confirm New Password
        </label>

        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          autoComplete="new-password"
        />
      </div>

      {passwordError && (
        <p className={styles.errorMessage}>
          {passwordError}
        </p>
      )}

      <div className={styles.editActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={cancelPasswordChange}
          disabled={passwordSaving}
        >
          Cancel
        </button>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleChangePassword}
          disabled={passwordSaving}
        >
          {passwordSaving
            ? "Changing..."
            : "Change Password"}
        </button>
      </div>
    </>
  ) : (
    <>
      <p className={styles.muted}>
        Update the password you use to sign in
        to your G M W account.
      </p>

      {passwordMessage && (
        <p className={styles.successMessage}>
          {passwordMessage}
        </p>
      )}

      <button
        type="button"
        className={styles.primaryButton}
        onClick={openPasswordForm}
      >
        Change Password
      </button>
    </>
  )}
</section>

            <section className={styles.card}>
              <h2>Linked Accounts</h2>

              <p className={styles.muted}>
                You can sign in to G M W
                with the following account(s).
              </p>

              <div
                className={
                  styles.linkedAccount
                }
              >
                <div
                  className={
                    styles.googleIcon
                  }
                >
                  G
                </div>

                <span>
                  {currentUser.email}
                </span>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className={styles.rightColumn}>
            <section className={styles.card}>
              <h2>My Profile</h2>

              <div
                className={
                  styles.formStack
                }
              >
                <select
                  value={region}
                  onChange={(e) =>
                    setRegion(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Region
                  </option>

                  <option value="Sri Lanka">
                    Sri Lanka
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>

                  <option value="UAE">
                    United Arab Emirates
                  </option>

                  <option value="Singapore">
                    Singapore
                  </option>
                </select>

                <select
                  value={industry}
                  onChange={(e) =>
                    setIndustry(
                      e.target.value,
                    )
                  }
                >
                  <option value="Software & IT Services">
                    Software & IT Services
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Banking">
                    Banking
                  </option>

                  <option value="Investment Management">
                    Investment Management
                  </option>

                  <option value="Media">
                    Media
                  </option>
                </select>

                <select
                  value={jobTitle}
                  onChange={(e) =>
                    setJobTitle(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Job Title
                  </option>

                  <option value="Founder">
                    Founder
                  </option>

                  <option value="Developer">
                    Developer
                  </option>

                  <option value="Analyst">
                    Analyst
                  </option>

                  <option value="Trader">
                    Trader
                  </option>

                  <option value="Manager">
                    Manager
                  </option>
                </select>

                <select
                  value={seniority}
                  onChange={(e) =>
                    setSeniority(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Seniority
                  </option>

                  <option value="Entry">
                    Entry
                  </option>

                  <option value="Mid">
                    Mid
                  </option>

                  <option value="Senior">
                    Senior
                  </option>

                  <option value="Director">
                    Director
                  </option>

                  <option value="Executive">
                    Executive
                  </option>
                </select>

                {profileError && (
  <p className={styles.errorMessage}>
    {profileError}
  </p>
)}

{profileMessage && (
  <p className={styles.successMessage}>
    {profileMessage}
  </p>
)}

<button
  type="button"
  className={styles.primaryButton}
  onClick={handleSavePreferences}
  disabled={profileSaving}
>
  {profileSaving
    ? "Saving..."
    : "Save Profile"}
</button>
              </div>
            </section>

            <section className={styles.card}>
              <h2>Email Settings</h2>

              <p>
                Here are the emails you
                currently receive.
              </p>

              <div
                className={
                  styles.emailSetting
                }
              >
                <span>
                  News and offers related to
                  G M W products
                </span>

                <button type="button">
                  + Opt In
                </button>
              </div>

              <p className={styles.muted}>
                To manage newsletter emails,
                go to Newsletters.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}