import format from 'string-format'
import exec from 'actions-exec-listener'

export class Branch {
  async deleteBranchIfExists(deletedBranch: string, unformattedBranchInput: string) {
    const branchToBeDeleted = this.formatted(unformattedBranchInput, deletedBranch)
    if (this.existsBranch(branchToBeDeleted)) {
      await this.deleteBranch(branchToBeDeleted)
    }
  }

  async deleteBranch(branch: string) {
    await exec.exec(`git push origin`, [`:${branch}`])
  }

  async existsBranch(branch: string): Promise<boolean> {
    const { stdoutStr: rawBranchList } = await exec.exec(`sh -c`, [`git ls-remote --heads $(git remote get-url origin) ${branch}`])
    return rawBranchList.includes(branch)
  }

  formatted(unformatted: string, originalBranch: string) {
    return format(unformatted, {
      branch: originalBranch
    })
  }
}