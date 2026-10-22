"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

import styles from "./Register.module.scss";

type FieldErrors = {
  name?: string;
  country?: string;
  phone?: string;
  email?: string;
  password?: string;
  isTrader?: string;
};

type CountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");

  const [country, setCountry] = useState<CountryCode | "">("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [isTrader, setIsTrader] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Country dropdown data (computed once; no effect/state needed)
  const countries = useMemo<CountryOption[]>(() => {
    const regionNames = new Intl.DisplayNames(["en"], {
      type: "region",
    });

    return getCountries()
      .map((countryCode) => ({
        code: countryCode,

        name: regionNames.of(countryCode) ?? countryCode,

        callingCode: getCountryCallingCode(countryCode),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  function handleCountryChange(countryCode: CountryCode | "") {
    setCountry(countryCode);

    if (countryCode) {
      const callingCode = getCountryCallingCode(countryCode);

      setPhone(`+${callingCode} `);
    } else {
      setPhone("");
    }

    setFieldErrors((current) => ({
      ...current,
      country: undefined,
      phone: undefined,
    }));
  }
  function validateForm() {
    const errors: FieldErrors = {};

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    // =========================
    // NAME
    // =========================

    if (!cleanName) {
      errors.name = "Full name is required.";
    } else if (cleanName.length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    } else if (cleanName.length > 100) {
      errors.name = "Full name must be 100 characters or fewer.";
    } else if (!/^[\p{L}\p{M} .'’-]+$/u.test(cleanName)) {
      errors.name = "Please enter a valid full name.";
    }

    // =========================
    // COUNTRY
    // =========================

    if (!country) {
      errors.country = "Please select your country.";
    }

    // =========================
    // PHONE
    // =========================

    if (!country) {
      errors.phone = "Please select your country first.";
    } else if (!cleanPhone) {
      errors.phone = "Phone number is required.";
    } else {
      try {
        const validPhone = isValidPhoneNumber(cleanPhone, country);

        if (!validPhone) {
          errors.phone =
            "Please enter a valid phone number for the selected country.";
        }
      } catch {
        errors.phone = "Please enter a valid phone number.";
      }
    }

    // =========================
    // EMAIL
    // =========================

    if (!cleanEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    // =========================
    // PASSWORD
    // =========================

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Password must contain a lowercase letter.";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain an uppercase letter.";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain a number.";
    }

    // =========================
    // TRADER
    // =========================

    if (isTrader === null) {
      errors.isTrader = "Please select whether you are a trader.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name.trim(),
          country,
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
          isTrader,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to create account.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.registerCard}>
        <div className={styles.brand}>
          <Link href="/" aria-label="Go to home page">
            <Image
              src="/images/gmw black-01.svg"
              alt="GMW"
              width={180}
              height={60}
              priority
            />
          </Link>
        </div>

        <h1>Create your account</h1>

        <p className={styles.subtitle}>
          Register for full access to Gulf Market Wire news, markets, finance, economics
          and technology.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* NAME */}
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              maxLength={100}
              autoComplete="name"
              aria-invalid={!!fieldErrors.name}
              onChange={(e) => {
                setName(e.target.value);

                setFieldErrors((current) => ({
                  ...current,
                  name: undefined,
                }));
              }}
            />

            {fieldErrors.name && (
              <span className={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          {/* COUNTRY */}
          <div className={styles.field}>
            <label htmlFor="country">Country</label>

            <select
              id="country"
              value={country}
              autoComplete="country-name"
              aria-invalid={!!fieldErrors.country}
              onChange={(e) =>
                handleCountryChange(e.target.value as CountryCode | "")
              }
            >
              <option value="">Select your country</option>

              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} (+{item.callingCode})
                </option>
              ))}
            </select>

            {fieldErrors.country && (
              <span className={styles.fieldError}>{fieldErrors.country}</span>
            )}
          </div>

          {/* PHONE */}
          <div className={styles.field}>
            <label htmlFor="phone">Phone Number</label>

            <input
              id="phone"
              type="tel"
              placeholder={
                country
                  ? `+${getCountryCallingCode(country)} Phone number`
                  : "Select country first"
              }
              value={phone}
              autoComplete="tel"
              disabled={!country}
              aria-invalid={!!fieldErrors.phone}
              onChange={(e) => {
                setPhone(e.target.value);

                setFieldErrors((current) => ({
                  ...current,
                  phone: undefined,
                }));
              }}
            />
            {fieldErrors.phone && (
              <span className={styles.fieldError}>{fieldErrors.phone}</span>
            )}
          </div>

          {/* EMAIL */}
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);

                setFieldErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }}
            />

            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          {/* PASSWORD */}
          <div className={styles.field}>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Use 8+ characters with uppercase, lowercase, and a number"
              value={password}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
              onChange={(e) => {
                setPassword(e.target.value);

                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
              }}
            />

            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* TRADER QUESTION */}
          <div className={styles.traderSection}>
            <div>
              <h3>Are you a trader?</h3>

              <p>
                This helps us personalize market, trading and financial content
                for you.
              </p>
            </div>

            <div className={styles.traderOptions}>
              <button
                type="button"
                className={isTrader === true ? styles.selectedOption : ""}
                onClick={() => {
                  setIsTrader(true);

                  setFieldErrors((current) => ({
                    ...current,
                    isTrader: undefined,
                  }));
                }}
              >
                Yes
              </button>

              <button
                type="button"
                className={isTrader === false ? styles.selectedOption : ""}
                onClick={() => {
                  setIsTrader(false);

                  setFieldErrors((current) => ({
                    ...current,
                    isTrader: undefined,
                  }));
                }}
              >
                No
              </button>
            </div>

            {fieldErrors.isTrader && (
              <span className={styles.fieldError}>{fieldErrors.isTrader}</span>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.login}>
          Already registered? <Link href="/login">Sign In</Link>
        </div>

        <p className={styles.terms}>
          By creating an account, you agree to Gulf Market Wire&apos;s{" "}
          <Link href="/terms">Terms of Use</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
