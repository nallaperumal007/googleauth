import React from "react";
import cls from "./profileHeader.module.scss";
import ArrowLeftSLineIcon from "remixicon-react/ArrowLeftSLineIcon";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { useAuth } from "contexts/auth/auth.context";
import SecondaryButton from "components/button/secondaryButton";

const ProfileDropdown = dynamic(
  () => import("components/profileDropdown/profileDropdown"),
);

type Props = {};

export default function ProfileHeader({}: Props) {
  const { t } = useTranslation();
  const { pathname, back, push } = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleBack = () => {
    if (pathname.includes("orders")) {
      push("/orders");
      return;
    }
    if (pathname.includes("checkout")) {
      back();
      return;
    }
    push("/");
  };

  return (
    <div className="white-splash">
      <div className="container">
        <header className={cls.header}>
          <button className={cls.backBtn} onClick={handleBack}>
            <ArrowLeftSLineIcon />
            <span className={cls.text}>{t("back")}</span>
          </button>
          {isAuthenticated ? (
            <ProfileDropdown data={user} />
          ) : (
            <div>
              <SecondaryButton onClick={() => push("/login")}>
                {t("login")}
              </SecondaryButton>
            </div>
          )}
        </header>
      </div>
    </div>
  );
}
