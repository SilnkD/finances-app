import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
    @ApiProperty({example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJleHBlcnRAbWFpbC5ydSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzM5Nzc0ODA5LCJleHAiOjE3Mzk3ODIwMDl9.AWdOrKJmnhsgHZV5XnBvvi3X4G-bPKAXsT7LXBIc-zY', description: 'Токен пользователя'})
    token: string;
}  