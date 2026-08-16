"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import ProductForm from "../../components/ProductForm";
import { productService } from "@/services/product.service";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(id);
        setProduct(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product.");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      await productService.update(id, formData);
      toast.success("Product updated successfully.");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-neutral-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Edit Product</h1>
        <p className="mt-2 text-neutral-500">Update the product details.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ProductForm
          product={product}
          onSubmit={handleUpdate}
          onCancel={() => router.push("/admin/products")}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
