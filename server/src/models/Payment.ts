import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Student } from './Student';
import { generateUid } from '../utils/uidGenerator';

export interface PaymentAttributes {
  id: string;
  uid: string;
  studentId: string;
  amount: number;
  mealsIncluded: number;
  mealsUsed: number;
  comprobantePath: string;
  universityReceiptPath?: string;
  bankReceiptPath?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'uid' | 'mealsUsed' | 'isVerified'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: string;
  declare uid: string;
  declare studentId: string;
  declare amount: number;
  declare mealsIncluded: number;
  declare mealsUsed: number;
  declare comprobantePath: string;
  declare universityReceiptPath?: string;
  declare bankReceiptPath?: string;
  declare isVerified: boolean;
  declare verifiedBy?: string;
  declare verifiedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    uid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mealsIncluded: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mealsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comprobantePath: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    universityReceiptPath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bankReceiptPath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    hooks: {
      beforeValidate: (payment: Payment) => {
        payment.uid = generateUid('PAY');
      }
    }
  }
);

Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default Payment;
