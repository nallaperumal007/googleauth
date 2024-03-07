import React, { useMemo } from "react";
import cls from "./checkout.module.scss";
import { IShop, OrderFormValues, Payment } from "interfaces";
import CheckoutPayment from "containers/checkoutPayment/checkoutPayment";
import { useFormik } from "formik";
import { useSettings } from "contexts/settings/settings.context";
import orderService from "services/order";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "hooks/useRedux";
import { selectCurrency } from "redux/slices/currency";
import { selectUserCart } from "redux/slices/userCart";
import paymentService from "services/payment";
import { error, warning } from "components/alert/toast";
import { useTranslation } from "react-i18next";
import useShopWorkingSchedule from "hooks/useShopWorkingSchedule";
import getFirstValidDate from "utils/getFirstValidDate";
import { selectOrder } from "redux/slices/order";
import shopService from "services/shop";
import { clearCart } from "redux/slices/cart";

type Props = {
  data: IShop;
  children: any;
};

export default function CheckoutContainer({ data, children }: Props) {
  const { t } = useTranslation();
  const { settings, address, location } = useSettings();
  const latlng = location;
  const { push } = useRouter();
  const currency = useAppSelector(selectCurrency);
  const cart = useAppSelector(selectUserCart);
  const { order } = useAppSelector(selectOrder);
  const { isOpen } = useShopWorkingSchedule(data);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data: payments } = useQuery("payments", () =>
    paymentService.getAll(),
  );

  const { paymentType, paymentTypes } = useMemo(() => {
    let defaultPaymentType: Payment | undefined;
    let paymentTypesList: Payment[];
    if (settings?.payment_type === "admin") {
      defaultPaymentType = payments?.data.find(
        (item: Payment) => item.tag === "cash",
      );
      paymentTypesList = payments?.data || [];
    } else {
      defaultPaymentType = data?.shop_payments?.find(
        (item) => item.payment.tag === "cash",
      )?.payment;
      paymentTypesList = data?.shop_payments?.map((item) => item.payment) || [];
    }
    return {
      paymentType: defaultPaymentType,
      paymentTypes: paymentTypesList,
    };
  }, [settings, data, payments]);

  const formik = useFormik({
    initialValues: {
      coupon: "",
      location: {
        latitude: latlng?.split(",")[0],
        longitude: latlng?.split(",")[1],
      },
      address: {
        address,
        office: "",
        house: "",
        floor: "",
      },
      delivery_date: order.delivery_date || getFirstValidDate(data).date,
      delivery_time: order.delivery_time || getFirstValidDate(data).time,
      delivery_type: "delivery",
      note: "",
      payment_type: paymentType,
      notes: {},
    },
    enableReinitialize: true,
    onSubmit: (values: OrderFormValues) => {
      if (!values.payment_type) {
        warning(t("choose.payment.method"));
        return;
      }
      if (!isOpen) {
        warning(t("shop.closed"));
        return;
      }
      const payload = {
        ...values,
        currency_id: currency?.id,
        rate: currency?.rate,
        shop_id: data.id,
        cart_id: cart.id,
        payment_type: undefined,
      };
      mutate(payload);
    },
    validate: (values: OrderFormValues) => {
      const errors = {} as OrderFormValues;
      return errors;
    },
  });

  const { isLoading, mutate } = useMutation({
    mutationFn: (data: any) => orderService.create(data),
    onSuccess: (data) => {
      const payload = {
        id: data.data.id,
        payment: {
          payment_sys_id: formik.values.payment_type?.id,
        },
      };
      dispatch(clearCart());
      if (formik.values.payment_type?.tag === "stripe") {
        stripePay({ order_id: payload.id });
      }
      if (formik.values.payment_type?.tag === "razorpay") {
        razorPay({ order_id: payload.id });
      }
      if (formik.values.payment_type?.tag === "paystack") {
        paystackPay({ order_id: payload.id });
      }
      transactionCreate(payload);
    },
    onError: (err: any) => {
      error(err?.data?.message);
    },
  });

  const { isLoading: isLoadingTransaction, mutate: transactionCreate } =
    useMutation({
      mutationFn: (data: any) =>
        paymentService.createTransaction(data.id, data.payment),
      onSuccess: (data) => {
        queryClient.invalidateQueries(["profile", currency?.id]);
        push(`/orders/${data.data.id}`);
      },
      onError: (err: any) => {
        error(err?.data?.message);
      },
    });

  const { isLoading: isLoadingPay, mutate: stripePay } = useMutation({
    mutationFn: (data: any) => paymentService.stripePay(data),
    onSuccess: (data) => {
      window.location.replace(data.data.data.url);
    },
    onError: (err: any) => {
      error(err?.data?.message);
    },
  });

  const { isLoading: isLoadingRazorPay, mutate: razorPay } = useMutation({
    mutationFn: (data: any) => paymentService.razorPay(data),
    onSuccess: (data) => {
      window.location.replace(data.data.data.url);
    },
    onError: (err: any) => {
      error(err?.data?.message);
    },
  });

  const { isLoading: isLoadingPaystack, mutate: paystackPay } = useMutation({
    mutationFn: (data: any) => paymentService.paystackPay(data),
    onSuccess: (data) => {
      window.location.replace(data.data.data.url);
    },
    onError: (err: any) => {
      error(err?.data?.message);
    },
  });

  const { isSuccess: isInZone } = useQuery(
    ["shopZone", formik.values.location],
    () => shopService.checkZone({ address: formik.values.location }),
  );

  return (
    <div className={cls.root}>
      {!isInZone && formik.values.delivery_type === "delivery" && (
        <div className="container">
          <div className={cls.warning}>
            <div className={cls.text}>{t("no.delivery.address")}</div>
          </div>
        </div>
      )}
      <div className="container">
        <section className={cls.wrapper}>
          <main className={cls.body}>
            {React.Children.map(children, (child) => {
              return React.cloneElement(child, { data, formik });
            })}
          </main>
          <aside className={cls.aside}>
            <CheckoutPayment
              formik={formik}
              loading={
                isLoading ||
                isLoadingTransaction ||
                isLoadingPay ||
                isLoadingRazorPay ||
                isLoadingPaystack
              }
              payments={paymentTypes}
              isInZone={isInZone}
            />
          </aside>
        </section>
      </div>
    </div>
  );
}
