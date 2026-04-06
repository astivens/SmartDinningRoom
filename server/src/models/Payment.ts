import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Student } from './Student';

export interface PaymentAttributes {
  id: string;
  studentId: string;
  amount: number;
  mealsIncluded: number;
  mealsUsed: number;
  comprobantePath: string;
  isVerified: boolean;
  verifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'mealsUsed' | 'isVerified'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: string;
  declare studentId: string;
  declare amount: number;
  declare mealsIncluded: number;
  declare mealsUsed: number;
  declare comprobantePath: string;
  declare isVerified: boolean;
  declare verifiedBy?: string;
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
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments'
  }
);

Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default Payment;
