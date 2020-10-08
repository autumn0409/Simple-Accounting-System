const sequelize = require("sequelize");
const db = require("../models");

const Category = db.category;
const Record = db.record;

module.exports = {
  getRecords: async (req, res) => {
    let income = 0;
    let expenses = 0;
    const { month, year } = req.query;

    try {
      // query records
      const records = await Record.findAll({
        where: {
          [sequelize.Op.and]: [
            sequelize.where(sequelize.fn("YEAR", sequelize.col("date")), year),
            sequelize.where(
              sequelize.fn("MONTH", sequelize.col("date")),
              month
            ),
          ],
        },
        include: [
          { model: Category, attributes: ["type", "name"], required: true },
        ],
      });

      let dailyRecords = {};

      // process records one by one
      records.forEach((record) => {
        // get income and expenses of the record
        let recordExpenses = 0;
        let recordIncome = 0;

        if (record.category.type === "expenses") {
          recordExpenses = record.amount;
        } else if (record.category.type === "income") {
          recordIncome = record.amount;
        }

        income += recordIncome;
        expenses += recordExpenses;

        // create recordItem
        const dateOfRecord = new Date(record.date).getDate();
        const recordItem = {
          date: record.date,
          amount: record.amount,
          paymentMethod: record.paymentMethod,
          id: record.id,
          remarks: record.remarks,
          type: record.category.type,
          category: record.category.name,
        };

        // insert recordItem into dailyRecords
        if (!(dateOfRecord in dailyRecords)) {
          const dailyRecordObj = {
            income: recordIncome,
            expenses: recordExpenses,
            recordItems: [recordItem],
          };
          dailyRecords[dateOfRecord] = dailyRecordObj;
        } else {
          dailyRecords[dateOfRecord].recordItems.push(recordItem);
          dailyRecords[dateOfRecord].income += recordIncome;
          dailyRecords[dateOfRecord].expenses += recordExpenses;
        }
      });

      // only keep values in dailyRecords
      dailyRecords = Object.keys(dailyRecords).map((date) => {
        return dailyRecords[date];
      });

      const result = {
        month,
        income,
        expenses,
        dailyRecords,
      };
      res.status(200).json(result);
    } catch (err) {
      res.status(400).send("Get Error");
    }
  },

  createRecord: async (req, res) => {
    const { date, amount, type, category, paymentMethod, remarks } = req.body;

    try {
      const targetCategory = await Category.findOne({
        where: { type, name: category },
      });
      await Record.create({
        paymentMethod,
        remarks,
        amount,
        categoryId: targetCategory.id,
        date,
      });
      res.status(200).send("Create success");
    } catch (err) {
      res.status(400).send(err);
    }
  },

  editRecord: async (req, res) => {
    const {
      id,
      date,
      amount,
      type,
      category,
      paymentMethod,
      remarks,
    } = req.body;

    try {
      const targetRecord = await Record.findOne({
        where: { id },
        include: [{ model: Category, attributes: ["type", "name"] }],
      });

      if (
        targetRecord.paymentMethod !== paymentMethod ||
        targetRecord.remarks !== remarks ||
        targetRecord.amount !== amount ||
        targetRecord.category.type !== type ||
        targetRecord.category.name !== category ||
        targetRecord.date.getTime() !== new Date(date).getTime()
      ) {
        await Record.update(
          {
            paymentMethod,
            remarks,
            amount,
            categoryId: targetRecord.categoryId,
            date,
          },
          {
            where: {
              id,
            },
          }
        );

        res.status(200).send("Edit success");
      } else {
        res.status(200).send("Record not modified");
      }
    } catch (err) {
      res.status(400).send(err);
    }
  },

  deleteRecord: async (req, res) => {
    const { id } = req.params;

    try {
      await Record.destroy({
        where: {
          id,
        },
      });
      res.status(200).send("Delete success");
    } catch (err) {
      res.status(400).send(err);
    }
  },
};
