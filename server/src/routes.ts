import express from 'express';

import PointsController from './controllers/pointsController';
import ItemsController from './controllers/itemsController';

const routes = express.Router();
const pointsController = new PointsController();
const itemsController = new ItemsController();

routes.get('/', (request, response) => {
    console.log('HOME');
    response.json({message: "Hello world"});
})

/*
*   Padrões de nomes dos métodos dos controllers
*   index - listagem
*   show - recuperar por id
*   create - criação
*   update - atualização
*   delete - exclusão
*/

routes.get('/items', itemsController.index);

routes.post('/points', pointsController.create);
routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);

export default routes;