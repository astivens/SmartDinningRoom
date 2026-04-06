import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Student } from './Student';

export interface SupervisorAssignmentAttributes {
  id: string;
  supervisorId: string;
  studentId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SupervisorAssignmentCreationAttributes extends Optional<SupervisorAssignmentAttributes, 'id'> {}

export class SupervisorAssignment
  extends Model<SupervisorAssignmentAttributes, SupervisorAssignmentCreationAttributes>
  implements SupervisorAssignmentAttributes {
  declare id: string;
  declare supervisorId: string;
  declare studentId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupervisorAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    supervisorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'students', key: 'id' }
    }
  },
  {
    sequelize,
    modelName: 'SupervisorAssignment',
    tableName: 'supervisor_assignments',
    indexes: [{ unique: true, fields: ['supervisorId', 'studentId'] }]
  }
);

User.hasMany(SupervisorAssignment, { foreignKey: 'supervisorId', as: 'assignments' });
SupervisorAssignment.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });

Student.hasMany(SupervisorAssignment, { foreignKey: 'studentId', as: 'supervisorAssignments' });
SupervisorAssignment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default SupervisorAssignment;
