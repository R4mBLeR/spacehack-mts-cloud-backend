// corporation.response.dto.ts
export class MemberDto {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  surName: string | null;
  phoneNumber: string | null;
  createdAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.surName = user.surName ?? null;
    this.phoneNumber = user.phoneNumber ?? null;
    this.createdAt = user.created_at || user.createdAt;
  }
}

export class CorporationResponseDto {
  id: number;
  name: string;
  description: string | null;
  members: MemberDto[];
  membersCount: number;

  constructor(corp: any) {
    this.id = corp.id;
    this.name = corp.name;
    this.description = corp.description ?? null;
    this.members = (corp.members || []).map((m: any) => new MemberDto(m));
    this.membersCount = this.members.length;
  }
}
