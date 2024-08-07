import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    const sequelize = OrderModel.sequelize;
    if (!sequelize) {
      throw new Error("Sequelize instance not found");
    }

    await sequelize.transaction(async (t) => {
      await OrderModel.update(
        {
          customer_id: entity.customerId,
          total: entity.total(),
        },
        {
          where: { id: entity.id },
          transaction: t,
        }
      );

      const existingItems = await OrderItemModel.findAll({
        where: { order_id: entity.id },
        transaction: t,
      });
      const existingItemIds = existingItems.map((item) => item.id);

      for (const item of entity.items) {
        await OrderItemModel.upsert(
          {
            id: item.id,
            product_id: item.productId,
            order_id: entity.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
          },
          { transaction: t }
        );
      }

      const newItemIds = entity.items.map((item) => item.id);
      const itemsToRemove = existingItemIds.filter(
        (id) => !newItemIds.includes(id)
      );
      if (itemsToRemove.length > 0) {
        await OrderItemModel.destroy({
          where: { id: itemsToRemove },
          transaction: t,
        });
      }
    });
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({
      where: { id },
      include: [{ model: OrderItemModel }],
    });

    if (!orderModel) {
      throw new Error("Order not found");
    }

    const orderItems = orderModel.items.map(
      (orderItemModel) =>
        new OrderItem(
          orderItemModel.id,
          orderItemModel.name,
          orderItemModel.price,
          orderItemModel.product_id,
          orderItemModel.quantity
        )
    );
    return new Order(orderModel.id, orderModel.customer_id, orderItems);
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [{ model: OrderItemModel }],
    });

    return orderModels.map((orderModel) => {
      const orderItems = orderModel.items.map(
        (orderItemModel) =>
          new OrderItem(
            orderItemModel.id,
            orderItemModel.name,
            orderItemModel.price,
            orderItemModel.product_id,
            orderItemModel.quantity
          )
      );
      return new Order(orderModel.id, orderModel.customer_id, orderItems);
    });
  }
}
