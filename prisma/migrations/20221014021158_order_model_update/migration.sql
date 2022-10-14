/*
  Warnings:

  - A unique constraint covering the columns `[id,user_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "orders_id_user_id_key" ON "orders"("id", "user_id");
