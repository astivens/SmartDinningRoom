import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Student } from './Student';
import { generateUid } from '../utils/uidGenerator';

export interface SupervisorLogAttributes {
  id: string;
  uid: string;
  supervisorId: string;
  studentId: string;
  action: string;
  hora: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SupervisorLogCreationAttributes extends Optional<SupervisorLogAttributes, 'id' | 'uid'> {}

export class SupervisorLog extends Model<SupervisorLogAttributes, SupervisorLogCreationAttributes> implements SupervisorLogAttributes {
  declare id: string;
  declare uid: string;
  declare supervisorId: string;
  declare studentId: string;
  declare action: string;
  declare hora: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupervisorLog.init(
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
    supervisorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    hora: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'SupervisorLog',
    tableName: 'supervisor_logs',
    hooks: {
      beforeValidate: (log: SupervisorLog) => {
        log.uid = generateUid('SPL');
      }
    }
  }
);

export default SupervisorLog;

SupervisorLog.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });
SupervisorLog.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
