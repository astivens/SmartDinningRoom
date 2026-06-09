import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Student } from './Student';
import { User } from './User';
import { generateUid } from '../utils/uidGenerator';

export interface MealAttendanceAttributes {
  id: string;
  uid: string;
  studentId: string;
  supervisorId: string;
  date: Date;
  hora: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MealAttendanceCreationAttributes extends Optional<MealAttendanceAttributes, 'id' | 'uid'> {}

export class MealAttendance extends Model<MealAttendanceAttributes, MealAttendanceCreationAttributes> implements MealAttendanceAttributes {
  declare id: string;
  declare uid: string;
  declare studentId: string;
  declare supervisorId: string;
  declare date: Date;
  declare hora: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MealAttendance.init(
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
    supervisorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hora: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'MealAttendance',
    tableName: 'meal_attendances',
    hooks: {
      beforeValidate: (attendance: MealAttendance) => {
        attendance.uid = generateUid('MLA');
      }
    }
  }
);

Student.hasMany(MealAttendance, { foreignKey: 'studentId', as: 'attendances' });
MealAttendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
User.hasMany(MealAttendance, { foreignKey: 'supervisorId', as: 'supervisorAttendances' });
MealAttendance.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });

export default MealAttendance;
