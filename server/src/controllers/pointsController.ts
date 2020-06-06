import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {

    async create(request: Request, response: Response) {

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;

        const trx = await knex.transaction();
        const point = {
            image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=300&q=60',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
        const point_ids = await trx('points').insert(point);

        const point_itens = items.map((item_id: number) => {
            return {
                item_id,
                point_id: point_ids[0]
            }
        });

        await trx('points_items').insert(point_itens);

        await trx.commit();
        return response.json({
            id: point_ids[0], ...point
        });
    }

    async index(request: Request, response: Response) {
        const { city, uf, items } = request.query;
        const itemList = String(items).split(',').map(s => Number(s.trim()));
        console.log({ city, uf, itemList });

        const points = await knex('points').select('points.*')
            .join('points_items', 'points.id', '=', 'points_items.point_id')
            .whereIn('points_items.item_id', itemList)
            .where('uf', String(uf))
            .where('city', String(city))
            .distinct()

        if (!points)
            return response.status(400).json({ message: 'Point not found!' });
        return response.json(points);
    }

    async show(request: Request, response: Response) {
        console.log('Ponto por id');
        const { id } = request.params;
        const point = await knex('points').select('*')
            .where('id', id)
            .first();

        const items = await knex('items').select('items.title')
            .join('points_items', 'items.id', '=', 'points_items.item_id')
            .where('points_items.point_id', '=', id);

        if (!point)
            return response.status(400).json({ message: 'Point not found!' });

        return response.json({ ...point, items });
    }

    async all(request: Request, response: Response) {

        const points = await knex('points').select('*');

        if (!points)
            return response.status(400).json({ message: 'Point not found!' });
        return response.json(points);
    }
}

export default PointsController;