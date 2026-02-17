const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'HUMAN' }
    })
    
    if (existingAdmin) {
      console.log('✅ 管理员已存在:')
      console.log('   用户名:', existingAdmin.name)
      console.log('   ID:', existingAdmin.id)
      return
    }
    
    // 创建管理员
    const admin = await prisma.user.create({
      data: {
        name: 'admin',
        role: 'HUMAN',
        password: 'admin123',
      }
    })
    
    console.log('✅ 管理员创建成功！')
    console.log('   用户名:', admin.name)
    console.log('   密码: admin123')
    console.log('   ID:', admin.id)
  } catch (error) {
    console.error('❌ 创建失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()