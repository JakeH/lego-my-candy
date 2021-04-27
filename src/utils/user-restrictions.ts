import { UserInfo } from '../chat-bot/chat-bot.models';

export type UserRestrictions = Pick<Partial<UserInfo>, 'broadcaster' | 'moderator' | 'subscriber' | 'vip'>;

const allRestrictions: Array<keyof UserRestrictions> = ['broadcaster', 'moderator', 'subscriber', 'vip'];
/**
 * Returns true if the user is not restricted
 * 
 * @param user 
 * @param restrictions 
 * @returns 
 */
export function userHasPermission(user: UserInfo, restrictions: UserRestrictions): boolean {
    const scope: Array<keyof UserRestrictions> = [];

    if (user.broadcaster) {
        scope.push('vip', 'subscriber', 'moderator', 'broadcaster');
    }
    if (user.moderator) {
        scope.push('vip', 'subscriber', 'moderator');
    }
    if (user.subscriber) {
        scope.push('subscriber');
    }
    if (user.vip) {
        scope.push('vip');
    }

    return allRestrictions.every(res => {
        return restrictions[res] !== true || scope.includes(res);
    });
}
