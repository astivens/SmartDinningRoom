import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Student } from './Student';
import { generateUid } from '../utils/uidGenerator';

export enum ComplaintType {
  QUEJA = 'queja',
  SUGERENCIA = 'sugerencia',
  COMENTARIO = 'comentario'
}

export interface ComplaintAttributes {
  id: string;
  uid: string;
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

interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'uid' | 'isResolved'> {}

export class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
  declare id: string;
  declare uid: string;
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
    uid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
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
    tableName: 'complaints',
    hooks: {
      beforeValidate: (complaint: Complaint) => {
        complaint.uid = generateUid('CMP');
      }
    }
  }
);

Student.hasMany(Complaint, { foreignKey: 'studentId', as: 'complaints' });
Complaint.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default Complaint;
