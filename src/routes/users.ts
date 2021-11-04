import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import { paramMissingError } from '@shared/constants';

const userDao = <any>{};

/**
 * Get all users.
 *
 * @param req
 * @param res
 * @returns
 */
export async function getAllUsers(req: Request, res: Response) {
    const users = await userDao.getAll();
    return res.status(StatusCodes.OK).json({users});
}


/**
 * Add one user.
 *
 * @param req
 * @param res
 * @returns
 */
export async function addOneUser(req: Request, res: Response) {
    const { user } = req.body;
    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    await userDao.add(user);
    return res.status(StatusCodes.CREATED).end();
}


/**
 * Update one user.
 *
 * @param req
 * @param res
 * @returns
 */
export async function updateOneUser(req: Request, res: Response) {
    const { user } = req.body;
    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    user.id = Number(user.id);
    await userDao.update(user);
    return res.status(StatusCodes.OK).end();
}


/**
 * Delete one user.
 *
 * @param req
 * @param res
 * @returns
 */
export async function deleteOneUser(req: Request, res: Response) {
    const { id } = req.params;
    await userDao.delete(Number(id));
    return res.status(StatusCodes.OK).end();
}
