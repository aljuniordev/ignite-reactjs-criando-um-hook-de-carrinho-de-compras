import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyExists = cart.find(
        (product) => product.id === productId
      );

      const stocks = await api
        .get(`/stock/${productId}`)
        .then((res) => res.data);

      if (productAlreadyExists) {
        if (stocks.amount > productAlreadyExists.amount) {
          const cartUpdated = cart.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  amount: Number(product.amount) + 1,
                }
              : product
          );
          setCart(cartUpdated);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(cartUpdated)
          );
          toast.success("Produto adicionado.");
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      } else {
        const product = await api
          .get(`/products/${productId}`)
          .then((res) => res.data);

        if (stocks.amount > 0) {
          const cartNew = [...cart, { ...product, amount: 1 }];
          setCart(cartNew);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartNew));
          toast.success("Produto adicionado.");
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.some(
        (cartItem) => cartItem.id === productId
      );

      if (!productExistsInCart) {
        toast.error("Erro na remoção do produto");
        return;
      } else {
        const cartUpdated = cart.filter(
          (cartItem) => cartItem.id !== productId
        );
        setCart(cartUpdated);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));
        toast("Produto removido.");
        return;
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const stock = await api
        .get(`/stock/${productId}`)
        .then((res) => res.data);

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productExists = cart.find((product) => product.id === productId);

      if (!productExists) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const cartUpdated = cart.map((product) =>
        product.id === productId
          ? {
              ...product,
              amount: amount,
            }
          : product
      );
      setCart(cartUpdated);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdated));
      toast("Produto atualizado.");
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
