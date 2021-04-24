
export async function wait(duration: number): Promise<void> { 
    
    let resolve: () => void;

    setTimeout(resolve, duration);

    return new Promise(res => {
        resolve = res;
    });
}
