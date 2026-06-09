import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { generateUid } from '../utils/uidGenerator';

export interface AuditLogAttributes {
  id: string;
  uid: string;
  userId: string;
  userEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'uid' | 'details' | 'ipAddress'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare uid: string;
  declare userId: string;
  declare userEmail: string;
  declare action: string;
  declare details?: string;
  declare ipAddress?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AuditLog.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userEmail: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    hooks: {
      beforeValidate: (log: AuditLog) => {
        log.uid = generateUid('AUD');
      }
    }
  }
);

export default AuditLog;
