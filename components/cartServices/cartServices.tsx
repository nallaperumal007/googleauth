import React from "react";
import cls from "./cartServices.module.scss";
import Price from "components/price/price";
import { selectCurrency } from "redux/slices/currency";
import { useAppSelector } from "hooks/useRedux";
import { useBranch } from "contexts/branch/branch.context";
import { selectUserCart } from "redux/slices/userCart";
import useLocale from "hooks/useLocale";

export default function CartServices() {
  const { t } = useLocale();
  const currency = useAppSelector(selectCurrency);
  const { branch } = useBranch();
  const cart = useAppSelector(selectUserCart);

  const totalDiscount = cart?.user_carts.reduce((total, userCart) => {
    const userCartDiscount = userCart?.cartDetails?.reduce(
      (userTotal, item) => {
        const discount = item?.discount || 0;
        return (userTotal += discount);
      },
      0,
    );

    return (total += userCartDiscount);
  }, 0);

  const discount = cart?.receipt_discount
    ? cart?.receipt_discount + totalDiscount
    : totalDiscount;

  return (
    <div className={cls.wrapper}>
      <div className={cls.flex}>
        <div className={cls.item}>
          <div className={cls.row}>
            <h5 className={cls.title}>{t("discount")}</h5>
            {!!cart.receipt_discount && (
              <p className={cls.text}>{t("recipe.discount.definition")}</p>
            )}
          </div>
        </div>
        <div className={cls.price}>
          <Price number={discount} minus />
        </div>
      </div>
      {/* <div className={cls.flex}>
        <div className={cls.item}>
          <div className={cls.row}>
            <h5 className={cls.title}>{t("delivery")}</h5>
          </div>
        </div>
        <div className={cls.price}>
          <Price number={Number(branch?.price) * Number(currency?.rate)} />
        </div>
      </div> */}
    </div>
  );
}
