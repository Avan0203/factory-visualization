/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-12-14 11:26:15
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-12-22 00:45:55
 * @FilePath: /factory-visualization/packages/front/src/shard/utils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 获取今天的日期字符串和前30天的日期字符串（YYYY-MM-DD格式）,返回一个数组
export const getDateRange = (): [string, string] => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayDate = `${year}-${month}-${day}`
    const date30DaysAgo = new Date()
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30)
    const year30DaysAgo = date30DaysAgo.getFullYear()
    const month30DaysAgo = String(date30DaysAgo.getMonth() + 1).padStart(2, '0')
    const day30DaysAgo = String(date30DaysAgo.getDate()).padStart(2, '0')
    const todayAgo = `${year30DaysAgo}-${month30DaysAgo}-${day30DaysAgo}`
    return [todayAgo, todayDate]
}