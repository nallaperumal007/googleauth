import React from "react";
import MobileDrawer from "containers/drawer/mobileDrawer";
import ShoppingBag3LineIcon from "remixicon-react/ShoppingBag3LineIcon";
import cls from "./mobileCart.module.scss";
import Cart from "containers/cart/cart";
import { useAuth } from "contexts/auth/auth.context";
import ProtectedCart from "containers/cart/protectedCart";
import useModal from "hooks/useModal";
import { useShop } from "contexts/shop/shop.context";
import MemberCart from "containers/cart/memberCart";

type Props = {};

export default function MobileCart({}: Props) {
  const [visible, handleOpenCart, handleCloseCart] = useModal();
  const { isAuthenticated } = useAuth();
  const { isMember } = useShop();

  return (
    <>
      <div className={cls.btnWrapper}>
        <button className={cls.btn} onClick={handleOpenCart}>
          <ShoppingBag3LineIcon />
        </button>
      </div>
      <MobileDrawer open={visible} onClose={handleCloseCart}>
        {isMember ? (
          <MemberCart />
        ) : isAuthenticated ? (
          <ProtectedCart />
        ) : (
          <Cart />
        )}
      </MobileDrawer>
    </>
  );
}
