import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { phone } });
  }
  
  
  findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { user_id: id } });
  }

  create(user: Partial<User>): Promise<User> {
  const u = this.usersRepo.create(user as any);
  return this.usersRepo.save(u).then((res: any) => (Array.isArray(res) ? res[0] : res));
  }

  updatePassword(userId: number, password_hash: string) {
    return this.usersRepo.update({ user_id: userId }, { password_hash });
  }

  async updateProfile(userId: number, updateData: any): Promise<User> {
    await this.usersRepo.update({ user_id: userId }, updateData);
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found after update');
    return user;
  }
  
}
