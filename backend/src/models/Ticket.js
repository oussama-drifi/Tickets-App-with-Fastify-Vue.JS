import { DataTypes } from 'sequelize';

export const initTicketModel = (sequelize) => {
    return sequelize.define('Ticket', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        imagePath: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'verified', 'paid'),
            defaultValue: 'pending'
        },
        ticketDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
};