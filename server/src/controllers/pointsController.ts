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
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
        const point_ids = await trx('points').insert(point);

        const point_itens = items.split(',').map((item:string) => Number(item.trim())).map((item_id: number) => {
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

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.1.4:3333/uploads/${point.image}`
            }
        })

        return response.json(serializedPoints);
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