import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';
import { generateUid } from '../utils/uidGenerator';

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student',
  EXTERNAL_AUDITOR = 'external_auditor'
}

export interface UserAttributes {
  id: string;
  uid: string;
  email: string;
  password: string;
  name: string;
  lastName: string;
  telefono?: string;
  role: UserRole;
  isActive: boolean;
  isAuthorized: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'uid' | 'isActive' | 'isAuthorized' | 'resetPasswordToken' | 'resetPasswordExpires'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare uid: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare lastName: string;
  declare telefono?: string;
  declare role: UserRole;
  declare isActive: boolean;
  declare isAuthorized: boolean;
  declare resetPasswordToken?: string | null;
  declare resetPasswordExpires?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
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
    email: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [1, 30]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        len: [1, 20]
      }
    },
    lastName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        len: [1, 20]
      }
    },
    telefono: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.STUDENT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isAuthorized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeValidate: async (user: User) => {
        user.uid = generateUid('USR');
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
