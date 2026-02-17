const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // 更新管理员密码
    const admin = await prisma.user.updateMany({
      where: { role: 'HUMAN' },
      data: { password: 'admin123' }
    })
    
    console.log('✅ 管理员密码已更新！')
    console.log('   用户名: Admin')
    console.log('   密码: admin123')
    console.log('   影响记录数:', admin.count)
  } catch (error) {
    console.error('❌ 更新失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()