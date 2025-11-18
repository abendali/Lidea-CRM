import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WorkshopOrder, InsertWorkshopOrder, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks/use-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkshopOrderSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default function WorkshopOrders() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkshopOrder | null>(null);
  const { toast } = useToast();
  const { getUserName } = useUsers();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<WorkshopOrder[]>({
    queryKey: ["/api/workshop-orders"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createForm = useForm<InsertWorkshopOrder>({
    resolver: zodResolver(insertWorkshopOrderSchema),
    defaultValues: {
      productId: products[0]?.id || 1,
      quantity: 1,
      totalOrderValue: 0,
      materialCost: 0,
      woodCost: 0,
      otherCosts: 0,
      notes: "",
    } as InsertWorkshopOrder,
  });

  const editForm = useForm<InsertWorkshopOrder>({
    resolver: zodResolver(insertWorkshopOrderSchema),
    defaultValues: {
      productId: products[0]?.id || 1,
      quantity: 1,
      totalOrderValue: 0,
      materialCost: 0,
      woodCost: 0,
      otherCosts: 0,
      notes: "",
    } as InsertWorkshopOrder,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWorkshopOrder) => {
      return await apiRequest("POST", "/api/workshop-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-orders"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Workshop order created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workshop order",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorkshopOrder> }) => {
      return await apiRequest("PATCH", `/api/workshop-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-orders"] });
      setEditingOrder(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Workshop order updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workshop order",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workshop-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-orders"] });
      toast({
        title: "Success",
        description: "Workshop order deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workshop order",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: InsertWorkshopOrder) => {
    createMutation.mutate(data);
  };

  const handleEdit = (order: WorkshopOrder) => {
    setEditingOrder(order);
    editForm.reset({
      productId: order.productId,
      quantity: order.quantity,
      totalOrderValue: order.totalOrderValue,
      materialCost: order.materialCost,
      woodCost: order.woodCost,
      otherCosts: order.otherCosts,
      notes: order.notes,
    });
  };

  const handleUpdate = (data: InsertWorkshopOrder) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this workshop order?")) {
      deleteMutation.mutate(id);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const calculateProfit = (order: WorkshopOrder) => {
    const totalCost = order.materialCost + order.woodCost + order.otherCosts;
    return order.totalOrderValue - totalCost;
  };

  const calculateProfitMargin = (order: WorkshopOrder) => {
    if (order.totalOrderValue === 0) return 0;
    const profit = calculateProfit(order);
    return (profit / order.totalOrderValue) * 100;
  };

  if (ordersLoading || productsLoading) {
    return (
      <div className="p-8">
        <p data-testid="text-loading">Loading workshop orders...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Workshop Orders
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Workshop Order</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-product">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="totalOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Order Value</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-total-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="materialCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-material-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="woodCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wood Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-wood-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="otherCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Costs</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-other-costs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workshop Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground" data-testid="text-no-orders">
              No workshop orders yet. Create your first order to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Order Value</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Wood</TableHead>
                  <TableHead>Other</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const totalCost = order.materialCost + order.woodCost + order.otherCosts;
                  const profit = calculateProfit(order);
                  const margin = calculateProfitMargin(order);

                  return (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell>{format(new Date(order.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell data-testid={`text-product-${order.id}`}>
                        {getProductName(order.productId)}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{getUserName(order.createdBy)}</TableCell>
                      <TableCell>{formatCurrency(order.totalOrderValue)}</TableCell>
                      <TableCell>{formatCurrency(order.materialCost)}</TableCell>
                      <TableCell>{formatCurrency(order.woodCost)}</TableCell>
                      <TableCell>{formatCurrency(order.otherCosts)}</TableCell>
                      <TableCell>{formatCurrency(totalCost)}</TableCell>
                      <TableCell
                        className={profit >= 0 ? "text-green-600" : "text-red-600"}
                        data-testid={`text-profit-${order.id}`}
                      >
                        {formatCurrency(profit)}
                      </TableCell>
                      <TableCell
                        className={margin >= 0 ? "text-green-600" : "text-red-600"}
                        data-testid={`text-margin-${order.id}`}
                      >
                        {margin.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(order)}
                            data-testid={`button-edit-${order.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(order.id)}
                            data-testid={`button-delete-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingOrder && (
        <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Workshop Order</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-product">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-edit-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="totalOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Order Value</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-edit-total-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="materialCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-edit-material-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="woodCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wood Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-edit-wood-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="otherCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Costs</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            data-testid="input-edit-other-costs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-edit-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingOrder(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
