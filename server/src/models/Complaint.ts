import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum ComplaintType {
  QUEJA = 'queja',
  SUGERENCIA = 'sugerencia',
  COMENTARIO = 'comentario'
}

export interface ComplaintAttributes {
  id: string;
  studentId?: string;
  type: ComplaintType;
  content: string;
  isAnonymous: boolean;
  response?: string;
  respondedBy?: string;
  isResolved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'isResolved'> {}

export class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
  declare id: string;
  declare studentId?: string;
  declare type: ComplaintType;
  declare content: string;
  declare isAnonymous: boolean;
  declare response?: string;
  declare respondedBy?: string;
  declare isResolved: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Complaint.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ComplaintType)),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    respondedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Complaint',
    tableName: 'complaints'
  }
);

export default Complaint;
