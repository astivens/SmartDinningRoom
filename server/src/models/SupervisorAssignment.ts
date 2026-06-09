import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Student } from './Student';
import { generateUid } from '../utils/uidGenerator';

export interface SupervisorAssignmentAttributes {
  id: string;
  uid: string;
  supervisorId: string;
  studentId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SupervisorAssignmentCreationAttributes extends Optional<SupervisorAssignmentAttributes, 'id' | 'uid'> {}

export class SupervisorAssignment
  extends Model<SupervisorAssignmentAttributes, SupervisorAssignmentCreationAttributes>
  implements SupervisorAssignmentAttributes {
  declare id: string;
  declare uid: string;
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
    uid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
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
    indexes: [{ unique: true, fields: ['supervisor_id', 'student_id'] }],
    hooks: {
      beforeValidate: (assignment: SupervisorAssignment) => {
        assignment.uid = generateUid('SPA');
      }
    }
  }
);

User.hasMany(SupervisorAssignment, { foreignKey: 'supervisorId', as: 'assignments' });
SupervisorAssignment.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });

Student.hasMany(SupervisorAssignment, { foreignKey: 'studentId', as: 'supervisorAssignments' });
SupervisorAssignment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

export default SupervisorAssignment;
