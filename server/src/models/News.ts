import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { generateUid } from '../utils/uidGenerator';

export interface NewsAttributes {
  id: string;
  uid: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsCreationAttributes extends Optional<NewsAttributes, 'id' | 'uid' | 'isActive'> {}

export class News extends Model<NewsAttributes, NewsCreationAttributes> implements NewsAttributes {
  declare id: string;
  declare uid: string;
  declare title: string;
  declare content: string;
  declare imageUrl?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

News.init(
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
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    hooks: {
      beforeValidate: (news: News) => {
        news.uid = generateUid('NWS');
      }
    }
  }
);

export default News;
