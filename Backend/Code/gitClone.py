import os
import git
from git.exc import GitCommandError
import shutil
import stat



def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)


def delete_folder_contents(folder_path):
    for root, dirs, files in os.walk(folder_path, topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))


def generate_folder_structure_json(folder_path):
    folder_structure = {}
    for root, dirs, files in os.walk(folder_path):
        relative_path = os.path.relpath(root, folder_path)
        if relative_path == '.':
            relative_path = ''
        folder_structure[relative_path] = {'dirs': dirs, 'files': files}
    return folder_structure


def clone_github_repo(repo_url, dest_folder='Code/src_code'):
    """
    Clone a GitHub repository to a specified destination folder.

    Args:
        repo_url (str): The URL of the GitHub repository.
        dest_folder (str): The destination folder to save the repository code.

    Returns:
        str: A message indicating success or failure.
    """
    if os.path.exists(dest_folder):
        delete_folder_contents(dest_folder)

    try:
        os.makedirs(dest_folder, exist_ok=True)

        print(f"Cloning the repository {repo_url} into {dest_folder}...")
        git.Repo.clone_from(repo_url, dest_folder)

        git_dir = os.path.join(dest_folder, '.git')
        if os.path.exists(git_dir):
            shutil.rmtree(git_dir, onerror=remove_readonly)

        folder_structure_json = generate_folder_structure_json(dest_folder)
        return folder_structure_json

    except GitCommandError as e:
        return f"Failed to clone the repository. Error: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"
